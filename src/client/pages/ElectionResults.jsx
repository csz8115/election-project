import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ErrorMessage from "../components/Utils/ErrorMessage";

const baseUrl = import.meta.env.VITE_API_BASE;

const ElectionResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();

  const handleBackButton = () => {
    navigate(-1); // Navigate back to the previous page
  };

  if (!location.state) {
    return (
      <div className="company">
        <button className="backButton" onClick={handleBackButton}>
          &lt; Back
        </button>
        <h1>Ballot Not Found</h1>
        <p>Please go back to the dashboard and select a company.</p>
      </div>
    );
  }

  const ballotID = location.state.ballotID;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `${baseUrl}api/v1/officer/viewBallotResults?ballotID=${ballotID}`,
          {
            method: "GET",
            credentials: "include", // Include cookies for authentication
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch election results"
          );
        }

        const data = await response.json();
        console.log("Election results:", data);
        setResults(data);
      } catch (error) {
        console.error("Error fetching election results:", error);
        setErrorMessage(error.message);
      }
    };

    if (ballotID) {
      fetchResults();
    }
  }, [ballotID]);

  return (
    <div className="election-results">
      <button className="backButton" onClick={handleBackButton}>
        &lt; Back
      </button>

      <h2>Election Results</h2>

      {errorMessage && <ErrorMessage message={errorMessage} />}

      {!results && !errorMessage && <p>Loading results...</p>}

      {results && (
        <div className="results-container">
          <div className="ballot-info">
            <h3>{results.ballotName}</h3>
            <p>{results.description}</p>
            <p>
              <strong>Company:</strong> {results.company.companyName} (
              {results.company.abbreviation})
            </p>
            <p>
              <strong>Election Period:</strong>{" "}
              {new Date(results.startDate).toLocaleDateString()} -{" "}
              {new Date(results.endDate).toLocaleDateString()}
            </p>
          </div>

          {results.positions.length > 0 && (
            <div className="positions-results">
              <h3>Positions</h3>
              {results.positions.map((position) => (
                <div key={position.positionID} className="position-item">
                  <h4>{position.positionName}</h4>
                  <p>Total Votes: {position._count.positionVotes}</p>
                  <div className="candidates-list">
                    {position.candidates.map((item) => (
                      <div key={item.candidateID} className="candidate-result">
                        <p>
                          <strong>
                            {item.candidate.fName} {item.candidate.lName}
                          </strong>
                          {item.candidate.titles &&
                            ` - ${item.candidate.titles}`}
                        </p>
                        <p>Votes: {item.candidate._count.positionVotes}</p>
                        <p>
                          {position._count.positionVotes > 0
                            ? `${(
                                (item.candidate._count.positionVotes /
                                  position._count.positionVotes) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.initiatives.length > 0 && (
            <div className="initiatives-results">
              <h3>Initiatives</h3>
              {results.initiatives.map((initiative) => (
                <div key={initiative.initiativeID} className="initiative-item">
                  <h4>{initiative.initiativeName}</h4>
                  <p>{initiative.description}</p>
                  <p>Total Votes: {initiative._count.initiativeVotes}</p>
                  <div className="responses-list">
                    {initiative.responses.map((response) => (
                      <div
                        key={response.responseID}
                        className="response-result"
                      >
                        <p>
                          <strong>{response.response}:</strong>{" "}
                          {response._count.initiativeVotes} votes (
                          {initiative._count.initiativeVotes > 0
                            ? `${(
                                (response._count.initiativeVotes /
                                  initiative._count.initiativeVotes) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                          )
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ElectionResults;
