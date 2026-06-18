CREATE TABLE lab_pb_internal_bonding (
  id integer DEFAULT nextval('lab_pb_internal_bonding_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  position text,
  ib_value numeric,
  density_value numeric,
  avg_ib numeric,
  avg_density numeric,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);