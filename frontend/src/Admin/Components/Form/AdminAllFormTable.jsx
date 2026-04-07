import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

function FormUserList() {

    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

    // const fetchForms = async () => {
    //   const token = sessionStorage.getItem("authToken");
    //   try {
    //     const res = await axios.get(`${BACKEND_URL}/api/forms/`, {
    //       headers: {
    //         Authorization: `Token ${token}`,
    //       },
    //     });
    //     setForms(res.data);
    //   } catch (err) {
    //     setForms([]);
    //     setError(err);
    //   } finally {
    //     setLoading(false); // ✅ This ensures loading is false no matter what
    //   }
    // };

    // fetchForms();

        //   const $ = window.jQuery;
        let table = new window.DataTable('#AllFormTable')

        return () => {
            if (table) {
                table.destroy();
            }

        };
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error..{error}</div>;
    }
    if (!forms || forms.length === 0) {
        return <div>No forms available</div>;
    }


    return (
        <div>
            <div class="p-4 bg-white rounded-lg shadow-md">
                <div class="header">
                    <p className='tab-button active'>Form lists</p>
                    <Link to={"/forms/create"} class="create-button no-underline">Create form</Link>
                </div>
                <div class="table-container">

                    <table className='h-[532px] display' id='AllFormTable'>
                        <thead>
                            <tr>
                                <th>Form name</th>
                                <th>Status</th>
                                <th>Organization</th>
                                <th>Project</th>
                                <th>Date Modified</th>
                                <th>Data deployed</th>
                                <th>Submission</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><Link to="/forms/single-form">Malaria Rural Case</Link></td>
                                <td className="text-green-600">deployed</td>
                                <td>GMGI</td>
                                <td>Dhaka Malaria</td>
                                <td>3 Mar, 2025</td>
                                <td>1 Mar, 2025</td>
                                <td>41</td>
                            </tr>
                            <tr>
                                <td><Link to="/forms/single-form">Flood Assessment X78</Link></td>
                                <td className="text-blue-600">draft</td>
                                <td>WHO</td>
                                <td>FLODDx78</td>
                                <td>4 Mar, 2025</td>
                                <td>1 Mar, 2025</td>
                                <td>122</td>
                            </tr>
                            <tr>
                                <td><Link to="/forms/single-form">Village Infrastructure Map</Link></td>
                                <td className="text-green-600">deployed</td>
                                <td>GroupMappers</td>
                                <td>Village mapping</td>
                                <td>7 Mar, 2025</td>
                                <td>5 Mar, 2025</td>
                                <td>21</td>
                            </tr>
                            <tr>
                                <td><Link to="/forms/single-form">LAMA Climate</Link></td>
                                <td className="text-green-600">deployed</td>
                                <td>WHO</td>
                                <td>LAMA Climate</td>
                                <td>12 Mar, 2025</td>
                                <td>8 Mar, 2025</td>
                                <td>40</td>
                            </tr>
                            <tr>
                                <td><Link to="/forms/single-form">LAMA Climate V2</Link></td>
                                <td className="text-blue-600">draft</td>
                                <td>Global Fund</td>
                                <td>LAMA Climate</td>
                                <td>12 Mar, 2025</td>
                                <td>8 Mar, 2025</td>
                                <td>32</td>
                            </tr>
                            <tr>
                                <td><Link to="/forms/single-form">Malaria Case Review</Link></td>
                                <td className="text-green-600">deployed</td>
                                <td>GMGI</td>
                                <td>Dhaka Malaria</td>
                                <td>4 Feb, 2025</td>
                                <td>1 Feb, 2025</td>
                                <td>30</td>
                            </tr>
                            <tr>
                                <td><Link to="/forms/single-form">Malaria Case Report</Link></td>
                                <td className="text-green-600">deployed</td>
                                <td>GMGI</td>
                                <td>Dhaka Malaria</td>
                                <td>5 Feb, 2025</td>
                                <td>3 Feb, 2025</td>
                                <td>35</td>
                            </tr>
                            <tr>
                                <td><Link to="/forms/single-form">LAMA Climate Early</Link></td>
                                <td className="text-blue-600">draft</td>
                                <td>WHO</td>
                                <td>LAMA Climate</td>
                                <td>4 Jan, 2025</td>
                                <td>1 Jan, 2025</td>
                                <td>41</td>
                            </tr>
                            <tr>
                                <td><Link to="/forms/single-form">Dengue Dhaka</Link></td>
                                <td className="text-green-600">deployed</td>
                                <td>WHO</td>
                                <td>Bus Accident</td>
                                <td>9 Jan, 2025</td>
                                <td>5 Jan, 2025</td>
                                <td>21</td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    )
}

export default FormUserList