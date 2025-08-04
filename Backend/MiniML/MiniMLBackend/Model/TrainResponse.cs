namespace MiniMLBackend.Model
{
    public class TrainResponse
    {
        public string model {  get; set; }
        public int tp {  get; set; }
        public int tn { get; set; }
        public int fn { get; set; }
        public int fp { get; set; }
        public Dictionary<string,List<float>> train { get; set; }
        public Dictionary<string, List<float>> test { get; set; }
    }
}
