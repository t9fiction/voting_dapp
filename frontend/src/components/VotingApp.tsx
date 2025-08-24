'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import VotingAbi from '@/contract/abi.json';
import { contract_address } from '@/contract/address';

const CONTRACT_ADDRESS = contract_address as `0x${string}`;

interface Candidate {
  name: string;
  voteCount: bigint;
}

interface FormattedCandidate {
  name: string;
  voteCount: string;
}

export default function VotingApp() {
  const { address, isConnected } = useAccount();
  const [newCandidateName, setNewCandidateName] = useState('');
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState<bigint>(0n);

  // Read candidates from contract
  const { data: candidates, refetch: refetchCandidates } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingAbi.abi,
    functionName: 'getCandidates',
  });

  // Calculate total votes
  useEffect(() => {
    if (candidates && Array.isArray(candidates)) {
      const votes = (candidates as Candidate[]).reduce(
        (total, candidate) => total + candidate.voteCount,
        0n
      );
      setTotalVotes(votes);
      
      // If there are no votes, clear the winner
      if (votes === 0n) {
        setWinner(null);
      }
    }
  }, [candidates]);

  // Read winner from contract only if there are votes
  const { refetch: refetchWinner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingAbi.abi,
    functionName: 'getWinner',
    query: {
      enabled: totalVotes > 0n, // Only fetch winner if there are votes
    },
  });

  // Write contract functions
  const { writeContractAsync } = useWriteContract();

  // Clear notifications after 3 seconds
  const clearNotifications = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  // Add candidate
  const addCandidate = async () => {
    if (!newCandidateName.trim()) {
      setError('Candidate name is required');
      clearNotifications();
      return;
    }
    if (!isConnected) {
      setError('Please connect wallet');
      clearNotifications();
      return;
    }
    setLoading(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VotingAbi.abi,
        functionName: 'addCandidate',
        args: [newCandidateName],
      });
      setNewCandidateName('');
      await refetchCandidates();
      setError(null);
      setSuccess('Candidate added successfully');
      clearNotifications();
    } catch (err) {
      setError(`Failed to add candidate: ${err instanceof Error ? err.message : 'Unknown error'}`);
      clearNotifications();
    } finally {
      setLoading(false);
    }
  };

  // Vote
  const vote = async () => {
    if (selectedCandidateIndex === null) {
      setError('Please select a candidate');
      clearNotifications();
      return;
    }
    if (!isConnected) {
      setError('Please connect wallet');
      clearNotifications();
      return;
    }
    setLoading(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VotingAbi.abi,
        functionName: 'vote',
        args: [selectedCandidateIndex],
      });
      await refetchCandidates();
      setSelectedCandidateIndex(null);
      setError(null);
      setSuccess('Vote cast successfully');
      clearNotifications();
    } catch (err) {
      setError(`Failed to vote: ${err instanceof Error ? err.message : 'Unknown error'}`);
      clearNotifications();
    } finally {
      setLoading(false);
    }
  };

  // Check winner
  const checkWinner = async () => {
    if (totalVotes === 0n) {
      setWinner(null);
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await refetchWinner();
      setWinner(data as string);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch winner: ${err instanceof Error ? err.message : 'Unknown error'}`);
      clearNotifications();
    } finally {
      setLoading(false);
    }
  };

  // Format candidates (convert BigInt to string)
  const formattedCandidates: FormattedCandidate[] = (candidates as Candidate[] || []).map((candidate) => ({
    name: candidate.name,
    voteCount: candidate.voteCount.toString(),
  }));

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Decentralized Voting System</h1>
        <p className="text-gray-600">Secure, transparent voting powered by blockchain technology</p>
      </div>

      {/* Connect Wallet */}
      <div className="mb-8 flex justify-center">
        <ConnectButton 
          showBalance={false}
          accountStatus="address"
          chainStatus="icon"
        />
      </div>

      {/* Notifications */}
      <div className="mb-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
            <svg className="animate-spin h-6 w-6 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">Processing transaction...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Add Candidate */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Add New Candidate
          </h2>
          <p className="text-gray-600 text-sm mb-4">Add a candidate to the voting ballot.</p>
          <div className="flex gap-2 text-black">
            <input
              type="text"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              placeholder="Enter candidate name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected}
            />
            <button
              onClick={addCandidate}
              disabled={loading || !isConnected}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Right Column - Winner Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
            </svg>
            Election Results
          </h2>
          <div className="bg-white p-4 rounded-md border border-gray-200 mb-4">
            <p className="text-gray-700 font-medium">Current Winner:</p>
            <p className="text-xl font-bold text-blue-800 mt-1">
              {winner || (totalVotes === 0n ? 'No votes cast yet' : 'Click "Check Winner" to view the winner')}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Total votes cast: {totalVotes.toString()}
            </p>
          </div>
          <button
            onClick={checkWinner}
            disabled={totalVotes === 0n}
            className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Check Winner
          </button>
        </div>
      </div>

      {/* Candidate List */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Candidates ({formattedCandidates.length})
        </h2>
        
        {formattedCandidates.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-md border border-gray-200">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-gray-600 mt-2">No candidates added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formattedCandidates.map((candidate: FormattedCandidate, index: number) => (
              <div 
                key={index} 
                className={`p-4 rounded-md border transition-all cursor-pointer ${
                  selectedCandidateIndex === index 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:shadow-sm'
                }`}
                onClick={() => setSelectedCandidateIndex(index)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{candidate.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{candidate.voteCount} votes</p>
                  </div>
                  {selectedCandidateIndex === index && (
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vote Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={vote}
            disabled={loading || selectedCandidateIndex === null || !isConnected}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {loading ? 'Processing...' : 'Cast Your Vote'}
          </button>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Each connected wallet can vote once. Transactions require gas fees on the blockchain network.</p>
      </div>
    </div>
  );
}