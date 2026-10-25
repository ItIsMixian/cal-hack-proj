"""Time-period narratives for Mirrorville, adapted from Marglo's daily summaries."""
from contextlib import closing
from datetime import datetime
import hashlib
import json
import re
import sqlite3
import time
from activity_memory import iso


class DailyReports:
    def __init__(self, memory):
        self.memory=memory
        with closing(sqlite3.connect(memory.path)) as db:
            db.executescript('''
CREATE TABLE IF NOT EXISTS daily_reports(scope TEXT,date TEXT,text TEXT,input_hash TEXT,latest_at TEXT,updated REAL,PRIMARY KEY(scope,date));
CREATE TABLE IF NOT EXISTS daily_deliveries(scope TEXT,date TEXT,mirror_id TEXT,input_hash TEXT,PRIMARY KEY(scope,date,mirror_id));
CREATE TABLE IF NOT EXISTS activity_settings(key TEXT PRIMARY KEY,value TEXT);
''')
            db.commit()

    def settings(self):
        with closing(sqlite3.connect(self.memory.path)) as db:
            row=db.execute("SELECT value FROM activity_settings WHERE key='codex_auto'").fetchone()
        return bool(row and row[0]=='true')

    def set_codex(self, enabled):
        if type(enabled) is not bool: raise ValueError('Invalid source setting')
        with closing(sqlite3.connect(self.memory.path)) as db:
            db.execute("INSERT OR REPLACE INTO activity_settings VALUES('codex_auto',?)",('true' if enabled else 'false',));db.commit()

    def _days(self):
        with closing(sqlite3.connect(self.memory.path)) as db:
            db.row_factory=sqlite3.Row
            rows=db.execute("SELECT * FROM activity_episodes WHERE end_ts>=? AND (seconds>=2 OR app='Codex conversation') ORDER BY end_ts,id",(time.time()-7*86400,)).fetchall()
        days={}
        for raw in rows:
            row=dict(raw)
            start=max(row['start_ts'],time.time()-7*86400)
            bucket=datetime.fromtimestamp(start).astimezone().replace(minute=0,second=0,microsecond=0).timestamp()
            while bucket<=row['end_ts']:
                end=min(row['end_ts'],bucket+3600)
                begin=max(start,bucket)
                key=datetime.fromtimestamp(bucket).astimezone().strftime('%Y-%m-%dT%H:00%z')
                span=max(0,end-begin)
                seconds=1 if row['app']=='Codex conversation' else round(row['seconds']*span/max(1,row['end_ts']-row['start_ts']))
                if row['app']=='Codex conversation' or seconds>=2:
                    part={**row,'id':hashlib.sha256((row['id']+key).encode()).hexdigest()[:24],'start_ts':begin,'end_ts':end,'seconds':seconds}
                    days.setdefault(key,[]).append(part)
                bucket+=3600
        return days

    def _hash(self, rows):
        return hashlib.sha256(json.dumps(rows,sort_keys=True).encode()).hexdigest()[:24]

    def list(self, scope):
        days=self._days()
        with closing(sqlite3.connect(self.memory.path)) as db:
            db.row_factory=sqlite3.Row
            reports=[dict(r) for r in db.execute('SELECT date,text,input_hash AS hash,latest_at AS latestAt,updated FROM daily_reports WHERE scope=? ORDER BY date DESC LIMIT 168',(scope,))]
            deliveries=[dict(r) for r in db.execute('SELECT date,mirror_id AS mirrorId,input_hash AS hash FROM daily_deliveries WHERE scope=?',(scope,))]
        return {'reports':reports,'deliveries':deliveries,'days':[{'date':d,'hash':self._hash(rows),'count':len(rows)} for d,rows in sorted(days.items(),reverse=True)],'generation':self.memory.generation,'codexEnabled':self.settings()}

    def context(self, scope, date):
        if not isinstance(date,str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:00[+-]\d{4}',date): raise ValueError('Invalid period')
        rows=self._days().get(date,[])
        # Marglo samples the complete day instead of taking only the latest activity.
        # Keep both actual human context and foreground work when both are available.
        groups=[[r for r in rows if r['app']=='Codex conversation'],[r for r in rows if r['app']!='Codex conversation']]
        selected=[]
        for group in groups:
            limit=20 if all(groups) else 40
            selected.extend(group if len(group)<=limit else [group[i*(len(group)-1)//(limit-1)] for i in range(limit)])
        selected.sort(key=lambda r:(r['end_ts'],r['id']))
        episodes=[{'id':r['id'],'app':r['app'],'title':r['title'],'startAt':iso(r['start_ts']),'endAt':iso(r['end_ts']),'seconds':round(r['seconds'])} for r in selected]
        previous=[{'date':r['date'],'summary':r['text']} for r in self.list(scope)['reports'] if r['date']<date][:5]
        return {'date':date,'hash':self._hash(rows),'episodes':episodes,'generation':self.memory.generation,
                'latestAt':iso(max(r['end_ts'] for r in rows)) if rows else '',
                'overview':{'moments':len(rows),'ownerMessages':len(groups[0]),'observedMinutes':round(sum(r['seconds'] for r in groups[1])/60)},'previousReports':previous}

    def save(self, scope, body):
        if body['generation']!=self.memory.generation: raise ValueError('Activity changed')
        ids=set(body['episodeIds'])
        valid={r['id']:r for r in self._days().get(body['date'],[])}
        # A day may grow while the model is running. Its original input hash remains
        # the checkpoint so the next refresh can incorporate the new material.
        if not re.fullmatch(r'[a-f0-9]{24}',body['hash']) or not ids or not ids.issubset(valid): raise ValueError('Unknown source')
        themes=body['themes']
        if not isinstance(themes,list) or len(themes)!=1: raise ValueError('No day summary')
        theme=themes[0];text=theme.get('text','')
        if not isinstance(text,str) or not 40<=len(text)<=400: raise ValueError('Invalid day summary')
        if re.search(r'\b[\w.-]+\.exe\b',text,re.I) or any(len(valid[i]['title'])>=(32 if valid[i]['app']=='Codex conversation' else 24) and valid[i]['title'].lower() in text.lower() for i in ids):
            raise ValueError('Summary must paraphrase original activity')
        refs=theme.get('episodeIds',[]);quote=theme.get('evidence','')
        if not refs or not set(refs).issubset(ids) or not isinstance(quote,str) or len(quote)<4 or not any(quote in valid[i]['title'] for i in refs): raise ValueError('Ungrounded day summary')
        with closing(sqlite3.connect(self.memory.path)) as db:
            latest=iso(max(valid[i]['end_ts'] for i in ids))
            db.execute('INSERT OR REPLACE INTO daily_reports VALUES(?,?,?,?,?,?)',(scope,body['date'],text,body['hash'],latest,time.time()))
            db.execute("DELETE FROM daily_reports WHERE scope=? AND date NOT IN (SELECT date FROM daily_reports WHERE scope=? ORDER BY date DESC LIMIT 168)",(scope,scope));db.commit()

    def delivered(self, scope, date, mirror, hash_value):
        if not isinstance(mirror,str) or not re.fullmatch(r'\d{1,20}',mirror): raise ValueError('Invalid target')
        with closing(sqlite3.connect(self.memory.path)) as db:
            report=db.execute('SELECT input_hash FROM daily_reports WHERE scope=? AND date=?',(scope,date)).fetchone()
            if not report or report[0]!=hash_value: raise ValueError('Report changed')
            db.execute('INSERT OR REPLACE INTO daily_deliveries VALUES(?,?,?,?)',(scope,date,mirror,hash_value));db.commit()

    def clear(self):
        with closing(sqlite3.connect(self.memory.path)) as db:
            db.executescript('DELETE FROM daily_reports;DELETE FROM daily_deliveries;DELETE FROM activity_settings;');db.commit()
