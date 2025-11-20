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

public record LocationDto(int Id, string WhsId, string BinLocation, DateTime? CreatedAt);
public record CreateLocationRequest(string WhsId, string BinLocation);

public record BinMappingDto(int Id, int BinId, string Sku, string BatchNo, int UserId, DateTime? CreatedAt);
public record CreateBinMappingRequest(int BinId, string Sku, string BatchNo);
public record ScanLabelRequest(int BinId, string ScannedData);
