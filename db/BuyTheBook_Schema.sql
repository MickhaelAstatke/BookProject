/**
On your local machine, replace 'bookstore' with 'bookstore_db'
**/

-- Use JAWS_DB Database
USE bookstore;

-- Author table remains the core dimension for book metadata
CREATE TABLE `bookstore`.`Author` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `firstName` VARCHAR(45) NOT NULL,
  `lastName` VARCHAR(45) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Updated Book table removes commerce specific fields and adds curation metadata
CREATE TABLE `bookstore`.`Book` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `genre` VARCHAR(255) NOT NULL,
  `pubYear` INT NOT NULL,
  `readingLevel` VARCHAR(50) NOT NULL DEFAULT 'general',
  `isFeatured` TINYINT(1) NOT NULL DEFAULT 0,
  `collectionTag` VARCHAR(100) NULL,
  `isPremium` TINYINT(1) NOT NULL DEFAULT 0,
  `bookDescription` TEXT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `AuthorId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `AuthorId_idx` (`AuthorId` ASC),
  CONSTRAINT `AuthorId`
    FOREIGN KEY (`AuthorId`)
    REFERENCES `bookstore`.`Author` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Subscription Plan catalogue
CREATE TABLE `bookstore`.`Plan` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `priceCents` INT NOT NULL,
  `billingInterval` ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
  `trialDays` INT NOT NULL DEFAULT 0,
  `featuredContentHeadline` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Benefit catalogue describing plan perks
CREATE TABLE `bookstore`.`Benefit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `summary` TEXT NOT NULL,
  `icon` VARCHAR(45) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Bridge table mapping plans to benefits
CREATE TABLE `bookstore`.`PlanBenefit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `highlight` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `PlanId` INT NOT NULL,
  `BenefitId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `PlanId_idx` (`PlanId` ASC),
  INDEX `BenefitId_idx` (`BenefitId` ASC),
  CONSTRAINT `PlanBenefit_PlanId`
    FOREIGN KEY (`PlanId`)
    REFERENCES `bookstore`.`Plan` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `PlanBenefit_BenefitId`
    FOREIGN KEY (`BenefitId`)
    REFERENCES `bookstore`.`Benefit` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Bridge table mapping plans to curated book access rules
CREATE TABLE `bookstore`.`PlanBookAccess` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `accessType` ENUM('full','excerpt','featured') NOT NULL DEFAULT 'full',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `PlanId` INT NOT NULL,
  `BookId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `PlanBookAccess_PlanId_idx` (`PlanId` ASC),
  INDEX `PlanBookAccess_BookId_idx` (`BookId` ASC),
  CONSTRAINT `PlanBookAccess_PlanId`
    FOREIGN KEY (`PlanId`)
    REFERENCES `bookstore`.`Plan` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `PlanBookAccess_BookId`
    FOREIGN KEY (`BookId`)
    REFERENCES `bookstore`.`Book` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Subscription ledger with forward compatible user reference
CREATE TABLE `bookstore`.`Subscription` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `status` ENUM('trialing','active','canceled','expired') NOT NULL DEFAULT 'trialing',
  `trialEndsAt` DATETIME NULL,
  `renewsOn` DATETIME NULL,
  `canceledOn` DATETIME NULL,
  `userReference` VARCHAR(191) NULL,
  `PlanId` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `Subscription_PlanId_idx` (`PlanId` ASC),
  CONSTRAINT `Subscription_PlanId`
    FOREIGN KEY (`PlanId`)
    REFERENCES `bookstore`.`Plan` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
