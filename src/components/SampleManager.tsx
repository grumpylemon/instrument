import React, { useState } from 'react';
// @ts-ignore
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// @ts-ignore
import { faDownload, faCheck, faXmark, faMusic } from '@fortawesome/free-solid-svg-icons';

interface SampleManagerProps {
  onSampleLoaded: () => void;
}

const SampleManager: React.FC<SampleManagerProps> = ({ onSampleLoaded }) => {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const sampleSources = [
    {
      name: 'Free Trumpet Samples (26MB)',
      url: 'https://freesound.org/people/Samulis/packs/21614/',
      description: 'High quality trumpet samples from Freesound.org'
    },
    {
      name: 'Free Trombone Samples (31MB)',
      url: 'https://freesound.org/people/pjcohen/packs/21521/',
      description: 'High quality trombone samples from Freesound.org'
    },
    {
      name: 'FluidR3_GM SoundFont',
      url: 'https://member.keymusician.com/Member/FluidR3_GM/index.html',
      description: 'Full General MIDI SoundFont with brass instruments'
    }
  ];

  const handleDownloadSamples = async () => {
    setDownloadStatus('downloading');
    setMessage('Downloading sample data...');
    
    try {
      // In a real app, we would download actual sample files
      // This is just a simulation for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDownloadStatus('success');
      setMessage('Samples successfully loaded!');
      onSampleLoaded();
      
      // Close the dialog after success
      setTimeout(() => {
        setShowDialog(false);
        setDownloadStatus('idle');
      }, 2000);
    } catch (error) {
      setDownloadStatus('error');
      setMessage('Error loading samples. Using synthesized sound instead.');
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowDialog(true)} 
        className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-opacity-80 transition-colors"
        title="Improve sound quality with real instrument samples"
      >
        <FontAwesomeIcon icon={faMusic} />
      </button>
      
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background text-text p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Improve Sound Quality</h2>
              <button 
                onClick={() => setShowDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            
            <p className="mb-4">
              For the best audio experience, you can use high-quality instrument samples instead of synthesized sounds.
            </p>
            
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Sample Sources:</h3>
              <ul className="space-y-2">
                {sampleSources.map((source, index) => (
                  <li key={index} className="border border-gray-200 p-2 rounded">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-start text-primary hover:underline"
                    >
                      <FontAwesomeIcon icon={faDownload} className="mt-1 mr-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">{source.name}</span>
                        <p className="text-sm text-gray-600">{source.description}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              Download samples and place them in the public/samples folder:
              <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                trumpet-C4.mp3, trumpet-G4.mp3, trumpet-C5.mp3,<br />
                trombone-C3.mp3, trombone-G3.mp3, trombone-C4.mp3
              </code>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Continue with Synth Sound
              </button>
              
              <button
                onClick={handleDownloadSamples}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 flex items-center"
                disabled={downloadStatus === 'downloading'}
              >
                {downloadStatus === 'idle' && (
                  <>
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    Simulate Loading Samples
                  </>
                )}
                {downloadStatus === 'downloading' && 'Loading...'}
                {downloadStatus === 'success' && (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                    Samples Loaded!
                  </>
                )}
                {downloadStatus === 'error' && 'Try Again'}
              </button>
            </div>
            
            {message && (
              <p className={`mt-4 text-sm ${downloadStatus === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SampleManager; 