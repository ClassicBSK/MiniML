using Microsoft.AspNetCore.Mvc;
using MiniMLBackend.Dao;

namespace MiniMLBackend.Service
{
    public class CSVService
    {
        private EF_DataContext datacontext;

        public CSVService(EF_DataContext datacontext)
        {
            this.datacontext = datacontext;
        }

        
        
    }
}
