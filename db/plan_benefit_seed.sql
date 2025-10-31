USE bookstore;

INSERT INTO PlanBenefit(highlight,PlanId,BenefitId,createdAt,updatedAt)
VALUES
('Weekly spotlights',1,1,sysdate(),sysdate()),
('Discussion starters',1,3,sysdate(),sysdate()),
('Archive access',2,1,sysdate(),sysdate()),
('Exclusive drops',2,2,sysdate(),sysdate()),
('Guided journeys',2,3,sysdate(),sysdate()),
('VIP concierge',3,1,sysdate(),sysdate()),
('Salon invites',3,2,sysdate(),sysdate()),
('Masterclass notes',3,3,sysdate(),sysdate()),
('Author meetups',3,4,sysdate(),sysdate());
