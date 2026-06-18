CREATE TABLE lab_pb_surface_soundness (
  id integer DEFAULT nextval('lab_pb_surface_soundness_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  position text,
  t1_value numeric,
  avg_surface numeric,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);