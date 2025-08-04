using MiniMLBackend.Dao;
using MiniMLBackend.Model;

namespace MiniMLBackend.Service
{
    public class SimulationInstanceService
    {
        private EF_DataContext datacontext;

        public SimulationInstanceService(EF_DataContext datacontext)
        {
            this.datacontext = datacontext;
        }

        public Dictionary<string,object> AddSimulationInstance(SimulationInstanceModel simulationInstanceModel, string username)
        {
            Dictionary<string, object> result = new Dictionary<string, object>();

            User user = datacontext.Users.Where(u => u.username == username).FirstOrDefault();
            if (user == null) {
                result.Add("User Not found", 401);
                return result;
            }
            SimulationInstance s1 = new SimulationInstance()
            {
                simName = simulationInstanceModel.simName,
                userId = user.userId,
                user = user,
                trainCompleted = false,
            };
            datacontext.Simulations.Add(s1);
            datacontext.SaveChanges();
            result.Add("Success", 200);
            return result;
        }
        public List<SimulationInstance> GetSimulationInstances(string username)

        {
            List<SimulationInstance> sims=datacontext.Simulations.Where(s=>s.user.username==username).ToList();
            return sims;

        }
    }
}
