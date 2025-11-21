using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockCountBack.Models;

[Table("ntf_FreezeData")]
public class NtfFreezeData
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("whsId")]
    [Required]
    public int WhsId { get; set; }

    [Column("binId")]
    public int? BinId { get; set; }

    [Column("sku")]
    [Required]
    [MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Column("batchNo")]
    [MaxLength(50)]
    public string? BatchNo { get; set; }

    [Column("qty")]
    [Required]
    public decimal Qty { get; set; }

    [Column("uom")]
    [Required]
    [MaxLength(30)]
    public string Uom { get; set; } = string.Empty;

    [Column("unitPrice")]
    [Required]
    public decimal UnitPrice { get; set; }

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; }
}
