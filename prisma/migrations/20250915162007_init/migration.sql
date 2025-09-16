-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "viewerAddress" TEXT,
    "ipHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ListingStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "View_listingId_idx" ON "View"("listingId");

-- CreateIndex
CREATE INDEX "View_createdAt_idx" ON "View"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "View_listingId_ipHash_viewerAddress_key" ON "View"("listingId", "ipHash", "viewerAddress");

-- CreateIndex
CREATE INDEX "Like_listingId_idx" ON "Like"("listingId");

-- CreateIndex
CREATE INDEX "Like_userAddress_idx" ON "Like"("userAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Like_listingId_userAddress_key" ON "Like"("listingId", "userAddress");

-- CreateIndex
CREATE UNIQUE INDEX "ListingStats_listingId_key" ON "ListingStats"("listingId");

-- CreateIndex
CREATE INDEX "ListingStats_listingId_idx" ON "ListingStats"("listingId");
