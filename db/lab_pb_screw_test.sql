CREATE TABLE lab_pb_screw_test (
  id integer DEFAULT nextval('lab_pb_screw_test_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  position text,
  face_value numeric,
  edge_value numeric,
  avg_face numeric,
  avg_edge numeric,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);