import {TestRailOptions, TestRailResult} from "./testrail.interface";
import Axios, {AxiosInstance} from "axios";

/**
 * TestRail basic API wrapper
 */
export class TestRail {
    private readonly base: String;
    private request: AxiosInstance;

    constructor(private options: TestRailOptions) {
        // compute base url
        this.base = `https://${options.domain}/index.php`;
        this.request = Axios.create();
    }

    /**
     * Fetchs test cases from projet/suite based on filtering criteria (optional)
     * @param filters
     * @param {Function} callback
     */
    public fetchCases(filters?: { [key: string]: number[] }, callback?: Function): void {
        let filter = "";
        if (filters) {
            for (var key in filters) {
                if (filters.hasOwnProperty(key)) {
                    filter += "&" + key + "=" + filters[key].join(",");
                }
            }
        }

        let req = this._get(`get_cases/${this.options.projectId}&suite_id=${this.options.suiteId}${filter}`, (body) => {
            if (callback) {
                callback(body);
            }
        });
    }

    /**
     * Publishes results of execution of an automated test run
     * @param {string} name
     * @param {string} description
     * @param {TestRailResult[]} results
     * @param {Function} callback
     */
    public publish(name: string, description: string, results: TestRailResult[], callback?: Function): void {
        console.log(`Publishing ${results.length} test result(s) to ${this.base}`);

        this._post(`add_run/${this.options.projectId}`, {
            "suite_id": this.options.suiteId,
            "name": name,
            "description": description,
            "assignedto_id": this.options.assignedToId,
            "include_all": true
        }, (body) => {
            const runId = body.id
            console.log(`Results published to ${this.base}?/runs/view/${runId}`)
            this._post(`add_results_for_cases/${runId}`, {
                results: results
            }, (body) => {
                // execute callback if specified
                if (callback) {
                    callback();
                }
            })
        });
    }

    private _post(api: String, body: any, callback: Function, error?: Function) {
        this.request.post(`${this.base}?api/v2/${api}`, body, {
            headers: {
                "Content-Type": "application/json"
            },
            auth: {
                username: this.options.username,
                password: this.options.password
            }
        }).then((res) => {
                if (res.status != 200) {
                    console.log("Error: %s", JSON.stringify(res.data));
                    if (error) {
                        error(res.data);
                    } else {
                        throw new Error(res.data);
                    }
                }
                callback(res.data);
            });
    }

    private _get(api: String, callback: Function, error?: Function) {
        this.request.get(`${this.base}?api/v2/${api}`, {
            headers: {
                "Content-Type": "application/json"
            },
            auth: {
                username: this.options.username,
                password: this.options.password
            }
        }).then((res) => {
                if (res.data) {
                    console.log("Error: %s", JSON.stringify(res.data));
                    if (error) {
                        error(res.data);
                    } else {
                        throw new Error(res.data);
                    }
                }
                callback(res.data);
            });
    }
}
