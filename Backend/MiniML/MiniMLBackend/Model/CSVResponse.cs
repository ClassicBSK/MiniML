using System.Text.Json.Serialization;

namespace MiniMLBackend.Model
{
    public class CSVResponse
    {
        [JsonPropertyName("recordsCount")]
        public int RecordsCount { get; set; }

        [JsonPropertyName("columnCount")]
        public int ColumnCount { get; set; }

        [JsonPropertyName("passRate")]
        public float PassRate { get; set; }

        [JsonPropertyName("startDate")]
        public DateTime StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime EndDate { get; set; }
    }
}
