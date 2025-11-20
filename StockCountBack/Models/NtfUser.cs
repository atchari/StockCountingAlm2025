using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockCountBack.Models;

[Table("ntf_User")]
public class NtfUser
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("userName")]
    [MaxLength(50)]
    public string? UserName { get; set; }

    [Column("userPassword")]
    [MaxLength(255)]
    public string? UserPassword { get; set; }

    [Column("fullName")]
    [MaxLength(150)]
    public string? FullName { get; set; }

    [Column("role")]
    [MaxLength(20)]
    public string? Role { get; set; }

    [Column("createdAt")]
    public DateTime? CreatedAt { get; set; }
}
