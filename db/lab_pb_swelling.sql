CREATE TABLE lab_pb_swelling (
  id integer DEFAULT nextval('lab_pb_swelling_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  position text,
  t1 numeric,
  t2 numeric,
  ts_value numeric,
  avg_t1 numeric,
  avg_t2 numeric,
  avg_ts numeric,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);