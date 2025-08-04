using Microsoft.EntityFrameworkCore;

namespace MiniMLBackend.Dao
{
    public class EF_DataContext:DbContext
    {
        public EF_DataContext(DbContextOptions<EF_DataContext> options) : base(options) { }
        public DbSet<User> Users { get; set; }
        public DbSet<SimulationInstance> Simulations { get; set; }

        public DbSet<MLModel> MLModels { get; set; }

        public DbSet<CSVFile> cSVFiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasMany(c => c.simulations)
                .WithOne(o => o.user)
                .HasForeignKey(o => o.userId)
                .IsRequired();
            modelBuilder.Entity<SimulationInstance>()
                .HasOne(s=>s.mLModel)
                .WithOne(m=>m.simulationInstance)
                .HasForeignKey<MLModel>(m=>m.simId)
                .IsRequired();

            
            modelBuilder.Entity<SimulationInstance>()
                .HasOne(s => s.cSVFile)
                .WithOne(c => c.simulationInstance)
                .HasForeignKey<CSVFile>(m => m.simId)
                .IsRequired();
           
        }
    }
}
