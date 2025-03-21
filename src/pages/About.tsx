
import { motion } from 'framer-motion';
import { useEffect } from 'react';

const About = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            About Copywritely AI
          </h1>
          <p className="text-xl text-gray-600">
            Helping beginners master the art of copywriting with AI-powered guidance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl p-8 shadow-soft mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Copywritely AI was created to help aspiring copywriters, entrepreneurs, and 
            marketing professionals develop their skills in creating effective advertising 
            copy. We believe that great copywriting is a skill that can be learned and 
            improved with proper guidance and practice.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Our platform combines AI-generated briefs with detailed analysis to 
            provide a complete learning environment. Through practice with realistic scenarios 
            and immediate feedback, users can quickly improve their copywriting abilities and 
            gain confidence in their skills.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-8 shadow-soft mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
          
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-copywrite-teal-light rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-copywrite-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Brief Generation</h3>
                <p className="text-gray-700">
                  Our AI generates realistic advertising briefs for various scenarios, providing 
                  clear objectives, target audience information, key messages to include, and 
                  specific requirements for your copy.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-copywrite-teal-light rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-copywrite-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Copy Creation</h3>
                <p className="text-gray-700">
                  Users write their advertising copy in our intuitive editor, 
                  focusing on addressing the requirements outlined in the brief. This 
                  process mimics real-world copywriting assignments.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-copywrite-teal-light rounded-full p-3 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-copywrite-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">AI Analysis</h3>
                <p className="text-gray-700">
                  After submission, our AI analyzes the copy and provides detailed feedback on 
                  various aspects including clarity, persuasiveness, audience targeting, and 
                  adherence to the brief requirements. Each category receives a score and 
                  specific suggestions for improvement.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl p-8 shadow-soft"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Benefits</h2>
          
          <ul className="space-y-4">
            {[
              {
                title: "Practice with Purpose",
                description: "Train on realistic briefs that mirror real-world copywriting assignments."
              },
              {
                title: "Immediate Feedback",
                description: "Get instant analysis rather than waiting for human review."
              },
              {
                title: "Skill Development",
                description: "Identify your strengths and weaknesses to focus your learning efforts."
              },
              {
                title: "Track Progress",
                description: "Submit revised versions to see your improvement over time."
              },
              {
                title: "Industry Preparation",
                description: "Develop the skills and confidence needed for professional copywriting work."
              }
            ].map((benefit, index) => (
              <li key={index} className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-copywrite-teal mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-900">{benefit.title}</h3>
                  <p className="text-gray-700">{benefit.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
