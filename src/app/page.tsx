'use client';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import data from './data.json';

const questions = data.questions
const STORAGE_KEY = 'quizState';
const INITIAL_TIME = 60; // Default timer duration

const App = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timer, setTimer] = useState(INITIAL_TIME);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showPopup, setShowPopup] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  /** 
   * Load state from localStorage on initial render.
   * Ensures quiz progress is preserved after a page refresh.
   */
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setCurrentQuestionIndex(parsedState.currentQuestionIndex);
      setCorrectAnswers(parsedState.correctAnswers);
      setSelectedOption(parsedState.selectedOption)
      setShowResults(parsedState.showResults);
      setIsSubmitted(parsedState.isSubmitted)
      setIsTimeUp(parsedState.isTimeUp || false);

      // If time was already up, keep it at 0
      setTimer(parsedState.isTimeUp ? 0 : INITIAL_TIME);
    }
    setLoading(false);
  }, []);

  /** 
   * Persist quiz state to localStorage whenever critical state changes.
   */
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentQuestionIndex,
          correctAnswers,
          selectedOption,
          showResults,
          isSubmitted,
          isTimeUp,
        })
      );
    }
  }, [currentQuestionIndex, correctAnswers,selectedOption, showResults, isTimeUp,isSubmitted, loading]);

  /**
   * Timer countdown logic. Stops if time runs out or quiz ends.
   */
  useEffect(() => {
    if (isSubmitted || showResults || isTimeUp) return;

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [currentQuestionIndex, isSubmitted, showResults, isTimeUp]);

  /** Handles user selecting an option */
  const handleOptionClick = (index: number) => {
    if (!isSubmitted && !isTimeUp) setSelectedOption(index);
  };

  /** Submits the selected answer */
  const handleSubmit = () => {
    if (selectedOption !== null) {
      const isCorrect = selectedOption === questions[currentQuestionIndex].correctAnswer;
      setCorrectAnswers((prev) => (isCorrect ? prev + 1 : prev));
      setShowPopup(isCorrect ? 'Correct answer!' : 'Wrong answer!');
    }
    setIsSubmitted(true);
  };

  /** Automatically submits answer when time runs out */
  const handleAutoSubmit = () => {
    setIsTimeUp(true);
    setShowPopup("Time's up! Choose an option below.");
  };

  /** Moves to the next question or shows results if it's the last one */
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      resetStateForNextQuestion();
    } else {
      setShowResults(true);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  /** Resets the quiz back to the first question */
  const resetQuestionnaire = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setShowResults(false);
    resetStateForNextQuestion();
  };

  /** Resets state for the next question */
  const resetStateForNextQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowPopup('');
    setTimer(INITIAL_TIME);
    setIsTimeUp(false);
  };

  return (
    <div className={styles.App}>
      <h1>Questionnaire</h1>

      {/* Show loading spinner before quiz loads */}
      {loading ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <p>Loading...</p>
        </div>
      ) : showResults ? (
        // Show final results
        <div className={styles.summary}>
          <h2>Congratulations!</h2>
          <p>
            You answered {correctAnswers} out of {questions.length} questions correctly.
          </p>
          <button onClick={resetQuestionnaire}>Restart Questionnaire</button>
        </div>
      ) : (
        <>
          <div className={styles.timer}>Time Remaining: {timer}s</div>

          <div className={styles.question}>
            <h2>{questions[currentQuestionIndex].question}</h2>

            {/* Render answer options */}
            <div className={styles.options}>
              {questions[currentQuestionIndex].options.map((option, index) => (
                <div
                  key={index}
                  className={`${styles.option} 
                    ${selectedOption === index ? styles.selected : ''} 
                    ${isSubmitted && index === questions[currentQuestionIndex].correctAnswer ? styles.correct : ''}
                    ${isSubmitted && index === selectedOption && index !== questions[currentQuestionIndex].correctAnswer ? styles.incorrect : ''}`}
                  onClick={() => handleOptionClick(index)}
                >
                  {option}
                </div>
              ))}
            </div>

            {/* Handle button display logic */}
            {isTimeUp ? (
              <div className={styles.timeUpButtons}>
                <button className={styles.submitButton} onClick={resetQuestionnaire}>
                  Restart Test
                </button>
                {currentQuestionIndex + 1 < questions.length ? (
                  <button className={styles.submitButton} onClick={handleNextQuestion}>
                    Next Question
                  </button>
                ) : (
                  <button className={styles.submitButton} onClick={() => setShowResults(true)}>
                    View Results
                  </button>
                )}
              </div>
            ) : (
              <button
                className={styles.submitButton}
                onClick={isSubmitted ? handleNextQuestion : handleSubmit}
              >
                {isSubmitted
                  ? currentQuestionIndex + 1 === questions.length
                    ? 'View Results'
                    : 'Next Question'
                  : 'Submit'}
              </button>
            )}
          </div>

          {/* Display answer feedback */}
          {showPopup && <div className={styles.popup}><p>{showPopup}</p></div>}
        </>
      )}
    </div>
  );
};

export default App;
