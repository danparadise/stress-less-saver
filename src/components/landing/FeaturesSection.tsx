import DiscordLink from "../common/DiscordLink";

const FeaturesSection = () => {
  return (
    <div className="mt-16 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="p-6 rounded-lg bg-white/80 shadow-lg">
          <h3 className="text-xl font-semibold mb-3 text-purple-900">AI-Powered Analysis</h3>
          <p className="text-purple-700">Smart insights and patterns detection to help you make better financial decisions.</p>
        </div>
        <div className="p-6 rounded-lg bg-white/80 shadow-lg">
          <h3 className="text-xl font-semibold mb-3 text-purple-900">Secure & Private</h3>
          <p className="text-purple-700">Bank-level security to keep your financial data safe and protected.</p>
        </div>
        <div className="p-6 rounded-lg bg-white/80 shadow-lg">
          <h3 className="text-xl font-semibold mb-3 text-purple-900">Easy Integration</h3>
          <p className="text-purple-700">Seamlessly connect your financial documents and start analyzing in minutes.</p>
        </div>
      </div>
      
      <div className="flex justify-center">
        <DiscordLink className="shadow-lg hover:shadow-xl transition-shadow" />
      </div>
    </div>
  );
};

export default FeaturesSection;