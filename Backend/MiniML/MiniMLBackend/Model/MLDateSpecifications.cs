using System.ComponentModel.DataAnnotations.Schema;

namespace MiniMLBackend.Model
{
    public class MLDateSpecifications
    {
        public DateTime trainStart { get; set; }
        public DateTime trainEnd { get; set; }
        public DateTime testStart { get; set; }
        public DateTime testEnd { get; set; }
        public DateTime validStart { get; set; }
        public DateTime validEnd { get; set; }
    }
}
