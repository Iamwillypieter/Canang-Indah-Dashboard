CREATE TABLE lab_pb_density_profile (
  id integer DEFAULT nextval('lab_pb_density_profile_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  position text,
  max_top numeric,
  max_bot numeric,
  min_value numeric,
  mean_value numeric,
  min_mean_ratio numeric,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);