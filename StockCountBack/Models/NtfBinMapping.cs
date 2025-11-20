using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockCountBack.Models;

[Table("ntf_BinMapping")]
public class NtfBinMapping
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("binId")]
    [Required]
    public int BinId { get; set; }

    [Column("sku")]
    [Required]
    [MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Column("batchNo")]
    [Required]
    [MaxLength(50)]
    public string BatchNo { get; set; } = string.Empty;

    [Column("userId")]
    [Required]
    public int UserId { get; set; }

    [Column("createdAt")]
    public DateTime? CreatedAt { get; set; }
}
