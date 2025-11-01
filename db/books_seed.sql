USE bookstore;

INSERT INTO Book(title,genre,pubYear,readingLevel,isFeatured,collectionTag,isPremium,bookDescription,createdAt,updatedAt,AuthorId)
VALUES
('Parable of the Sower','Speculative Fiction',1993,'adult',1,'Future Visions',1,'A prophetic coming-of-age story set in a climate ravaged America where empathy becomes a superpower.',sysdate(),sysdate(),1),
('The Left Hand of Darkness','Science Fiction',1969,'adult',1,'Future Visions',1,'An envoy to the icy planet Gethen uncovers a society without fixed genders and a conspiracy that could tear worlds apart.',sysdate(),sysdate(),2),
('The Ocean at the End of the Lane','Fantasy',2013,'general',1,'Wonder Tales',0,'Returning home for a funeral, a man recalls childhood memories tinged with myth and the uncanny.',sysdate(),sysdate(),3),
('Circe','Myth Retelling',2018,'general',0,'Mythic Women',0,'The witch of Aiaia steps into the spotlight in this lyrical retelling that follows centuries of self-discovery.',sysdate(),sysdate(),4),
('Song of Solomon','Literary Fiction',1977,'adult',0,'Legacy Lines',1,'A sweeping exploration of family, flight, and the power of names within Black American history.',sysdate(),sysdate(),5),
('The Fifth Season','Science Fantasy',2015,'adult',1,'Worldbreakers',1,'As the world ends for the last time, an orogene fights to protect her daughter and unravel systemic oppression.',sysdate(),sysdate(),6),
('The Hate U Give','Young Adult',2017,'teen',0,'Voices Raised',0,'A teenager witnesses the police shooting of her best friend and becomes the face of a protest movement.',sysdate(),sysdate(),7),
('The Name of the Wind','Epic Fantasy',2007,'adult',0,'Worldbreakers',1,'Kvothe recounts his legendary rise from gifted child to notorious magician.',sysdate(),sysdate(),8),
('Atomic Habits','Personal Development',2018,'general',0,'Momentum Makers',0,'A framework for building better habits through small, consistent changes.',sysdate(),sysdate(),9),
('Little Fires Everywhere','Literary Fiction',2017,'general',1,'Community Curations',0,'Secrets ignite tensions when a nomadic artist and her daughter settle in suburban Shaker Heights.',sysdate(),sysdate(),10);
