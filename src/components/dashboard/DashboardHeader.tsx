interface DashboardHeaderProps {
  isDark?: boolean;
}

const DashboardHeader = ({ isDark }: DashboardHeaderProps) => {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold text-purple-800 dark:text-white">
        Financial Overview
      </h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        Track and manage your financial documents
      </p>
    </div>
  );
};

export default DashboardHeader;