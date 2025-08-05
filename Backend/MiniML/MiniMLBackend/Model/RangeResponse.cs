namespace MiniMLBackend.Model
{  
    
    public class RangeResponse
    {
        public Dictionary<string,int> trainData { get; set; }
        public Dictionary<string, int> testData { get; set; }
        public Dictionary<string, int> validData { get; set; }

    }
}
