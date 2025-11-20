using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockCountBack.Models;

[Table("ntf_WhsGroup")]
public class NtfWhsGroup
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("whsName")]
    [Required]
    [MaxLength(50)]
    public string WhsName { get; set; } = string.Empty;

    [Column("createdAt")]
    public DateTime? CreatedAt { get; set; }
}
