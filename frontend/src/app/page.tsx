import VotingApp from '../components/VotingApp';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Decentralized Voting Platform</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A secure, transparent voting system built on blockchain technology ensuring integrity and trust in election processes.
          </p>
        </div>
        <VotingApp />
      </div>
    </main>
  );
}