CREATE TABLE lab_pb_additional_tests (
  document_id integer NOT NULL PRIMARY KEY,
  avg_tebal_flakes numeric,
  avg_cons_hardener numeric,
  geltime_sl integer,
  geltime_cl integer,
  FOREIGN KEY (document_id) REFERENCES lab_pb_documents(id)
);