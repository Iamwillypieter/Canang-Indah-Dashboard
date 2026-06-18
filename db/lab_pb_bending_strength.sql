CREATE TABLE lab_pb_bending_strength (
  id integer DEFAULT nextval('lab_pb_bending_strength_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  position text,
  mor_value numeric,
  density_value numeric,
  avg_mor numeric,
  avg_density numeric,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);