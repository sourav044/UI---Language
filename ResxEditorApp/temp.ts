@eventID UNIQUEIDENTIFIER = NULL,
    @isBearerShares BIT = NULL,
    @page INT = NULL,
    @pageSize INT = NULL,
    @firstname NVARCHAR(250) = NULL,
    @lastname NVARCHAR(250) = NULL,
    @city NVARCHAR(250) = NULL,
    @externalReferenceNumber NVARCHAR(50) = NULL,
    @showRegistered BIT = NULL,
    @sharesFrom DECIMAL(18,3) = NULL,
    @searchTicketNo INT = NULL,
    @street NVARCHAR(250) = NULL,
    @plz INT = NULL,
    @email NVARCHAR(250) = NULL,
    @dateOfBirth DATE = NULL,
    @possessionType NVARCHAR(65) = NULL