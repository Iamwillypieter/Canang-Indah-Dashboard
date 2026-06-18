CREATE TABLE lab_pb_mc_board (
  id integer DEFAULT nextval('lab_pb_mc_board_id_seq'::regclass) NOT NULL PRIMARY KEY,
  document_id integer,
  position text,
  w1 numeric,
  w2 numeric,
  mc_value numeric,
  avg_w1 numeric,
  avg_w2 numeric,
  avg_mc numeric,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);