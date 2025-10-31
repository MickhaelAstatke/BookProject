USE bookstore;

INSERT INTO Benefit(label,summary,icon,createdAt,updatedAt)
VALUES
('Curated Shelves','Freshly updated selections arranged by our editorial team each week.','library_books',sysdate(),sysdate()),
('Premium Exclusives','Members-only essays, interviews, and advance chapters from partner authors.','stars',sysdate(),sysdate()),
('Guided Annotations','Expert-led reading paths with chapter notes and discussion prompts.','import_contacts',sysdate(),sysdate()),
('Live Workshops','Interactive workshops and Q&A sessions with authors and critics.','event',sysdate(),sysdate());
