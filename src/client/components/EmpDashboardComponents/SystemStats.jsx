import React from 'react';
import { useEffect, useState } from 'react';

import './Stats.css';

const SystemStats = ()=> {

    //return <h2>SystemStatsViewTest</h2>;

    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/getSystemStats`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                console.log(result);
                setStats(result);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }
    , []);

    //checks if stats have returned, if not, returns no stats available
    if(stats != null){
        return (
            <div className="statsContainer">
                {/* row for general stats, active users, etc */}
                <div className="statsRow">
                    <div className="statsColumn">
                        <h4>Active Users</h4>
                        <h4>{stats.activeUsers}</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Active Elections</h4>
                        <h4>{stats.activeElectionsCount}</h4>
                    </div>
                </div>
                <hr/>
                    {/* row for query stats */}
                <div className="statsRow">
                    <div className="statsColumn">
                        <h4>Total Queries</h4>
                        <h4>{stats.queryStats.totalQueries}</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Total Calls</h4>
                        <h4>{stats.queryStats.totalCalls}</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Total Exec Time</h4>
                        <h4>{stats.queryStats.totalExecTimeMs}(ms)</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Average Query Time</h4>
                        <h4>{stats.queryStats.avgQueryTimeMs}(ms)</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Max Average Query Time</h4>
                        <h4>{stats.queryStats.maxAvgQueryTimeMs}(ms)</h4>
                    </div>
                </div>
                <hr/>
                    {/* row for http stats */}
                <div className="statsRow">
                    <div className="statsColumn">
                        <h4>Total Requests</h4>
                        <h4>{stats.httpStats.totalRequests}</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Total Errors</h4>
                        <h4>{stats.httpStats.totalErrors}</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Total Response Time</h4>
                        <h4>{stats.httpStats.totalResponseTime}(ms)</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Average Response Time</h4>
                        <h4>{stats.httpStats.avgResponseTime}(ms)</h4>
                    </div>
                    <div className="statsColumn">
                        <h4>Max Response Time</h4>
                        <h4>{stats.httpStats.maxResponseTime}(ms)</h4>
                    </div>
                </div>

                
            </div>
        );
    }else{
        return (<h2>Stats not available</h2>);
    }
    


}

export default SystemStats;
