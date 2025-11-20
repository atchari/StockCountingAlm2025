namespace StockCountBack.DTOs;

public record LoginRequest(string UserName, string Password);
public record RegisterRequest(string UserName, string Password, string FullName, string Role);
public record ChangePasswordRequest(string OldPassword, string NewPassword);
public record LoginResponse(int Id, string UserName, string FullName, string Role, string Token);

public record UserDto(int Id, string? UserName, string? FullName, string? Role, DateTime? CreatedAt);
public record CreateUserRequest(string UserName, string Password, string FullName, string Role);
public record UpdateUserRequest(string? FullName, string? Role);

public record WhsGroupDto(int Id, string WhsName, DateTime? CreatedAt);
public record CreateWhsGroupRequest(string WhsName);

public record LocationDto(int Id, int WhsId, string BinLocation, DateTime? CreatedAt);
public record CreateLocationRequest(int WhsId, string BinLocation);

public record BinMappingDto(int Id, int BinId, string Sku, string BatchNo, int UserId, DateTime? CreatedAt);
public record CreateBinMappingRequest(int BinId, string Sku, string BatchNo);
public record ScanLabelRequest(int BinId, string ScannedData);

public record CountPersonDto(int Id, string FullName, DateTime? CreatedAt);
public record CreateCountPersonRequest(string FullName);

public record FreezeDataDto(int Id, int WhsId, string Sku, string BatchNo, decimal Qty, string Uom, decimal UnitPrice, DateTime? CreatedAt);
public record CreateFreezeDataRequest(int WhsId, string Sku, string BatchNo, decimal Qty, string Uom, decimal UnitPrice);
public record ImportFreezeDataRequest(int WhsId, string TsvContent);
