USE bookstore;

INSERT INTO Plan(name,description,priceCents,billingInterval,trialDays,featuredContentHeadline,createdAt,updatedAt)
VALUES
('Explorer','Foundational access to rotating curated shelves and community read-alongs.',9900,'monthly',7,'Weekly community picks',sysdate(),sysdate()),
('Enthusiast','Unlock the full premium archive, exclusive interviews, and guided annotations.',14900,'monthly',14,'Critic-led deep dives',sysdate(),sysdate()),
('Luminary','Yearlong VIP access with live workshops, early releases, and concierge recommendations.',24900,'yearly',30,'Author salons & masterclasses',sysdate(),sysdate());
