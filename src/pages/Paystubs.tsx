import PaystubData from "@/components/dashboard/PaystubData";

const Paystubs = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
          Paystubs
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          View and manage your paystub documents
        </p>
      </div>
      <PaystubData />
    </div>
  );
};

export default Paystubs;