using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MiniMLBackend.Dao
{
    [Table("simulations")]
    public class SimulationInstance
    {
        [Key]
        [Required]

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int simId { get; set; }
        public string simName { get; set; }
        public bool trainCompleted {  get; set; }

        [JsonIgnore]
        public int userId {  get; set; }

        [JsonIgnore]
        public User user { get; set; } = null!;

        [JsonIgnore]
        public MLModel mLModel { get; set; }

        [JsonIgnore]
        public CSVFile cSVFile { get; set; }    
    }
}
