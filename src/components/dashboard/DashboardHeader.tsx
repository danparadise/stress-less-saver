interface DashboardHeaderProps {
  isDark?: boolean;
}

const DashboardHeader = ({ isDark }: DashboardHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
        Welcome back!
      </h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        Take a look at your financial overview
      </p>
    </div>
  );
};

export default DashboardHeader;