CREATE TABLE lab_pb_samples (
  id integer DEFAULT nextval('lab_pb_samples_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  sample_no integer NOT NULL,
  weight_gr numeric,
  thickness_mm numeric,
  length_mm numeric,
  width_mm numeric,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);