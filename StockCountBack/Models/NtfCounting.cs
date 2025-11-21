using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockCountBack.Models;

[Table("ntf_Counting")]
public class NtfCounting
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

    [Column("countPersonId")]
    [Required]
    public int CountPersonId { get; set; }

    [Column("scanPersonId")]
    [Required]
    public int ScanPersonId { get; set; }

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; }

    [Column("updatedAt")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updatedBy")]
    public int? UpdatedBy { get; set; }
}
