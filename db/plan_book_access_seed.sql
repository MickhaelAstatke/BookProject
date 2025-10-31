USE bookstore;

INSERT INTO PlanBookAccess(accessType,PlanId,BookId,createdAt,updatedAt)
VALUES
('full',1,3,sysdate(),sysdate()),
('full',1,7,sysdate(),sysdate()),
('featured',1,10,sysdate(),sysdate()),
('full',1,9,sysdate(),sysdate()),
('full',2,1,sysdate(),sysdate()),
('full',2,3,sysdate(),sysdate()),
('excerpt',2,6,sysdate(),sysdate()),
('full',2,7,sysdate(),sysdate()),
('full',2,9,sysdate(),sysdate()),
('full',3,1,sysdate(),sysdate()),
('full',3,2,sysdate(),sysdate()),
('full',3,4,sysdate(),sysdate()),
('full',3,5,sysdate(),sysdate()),
('full',3,6,sysdate(),sysdate()),
('full',3,8,sysdate(),sysdate()),
('featured',3,10,sysdate(),sysdate());
