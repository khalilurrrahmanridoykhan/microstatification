import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../../../config';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const navigate = useNavigate();

  // Fetch orgs and projects
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');

    const fetchData = async () => {
      try {
        const [orgRes, projRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/organizations/`, {
            headers: { Authorization: `Token ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/projects/`, {
            headers: { Authorization: `Token ${token}` },
          }),
        ]);
        setOrganizations(orgRes.data);
        setProjects(projRes.data);
      } catch (error) {
        console.error(error);
        setOrganizations([]);
        setProjects([]);
      }
    };

    fetchData();
  }, []);

  // Combine both into unified list
  const allOptions = [
    ...organizations.map((item) => ({ ...item, type: 'organization' })),
    ...projects.map((item) => ({ ...item, type: 'project' })),
  ];

  // Filter suggestions as user types
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
    } else {
      const filtered = allOptions.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered);
    }
  }, [searchTerm, organizations, projects]);

  // Handle item selection
  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchTerm(item.name);
    setSuggestions([]);
    console.log('Selected:', item);
  };

  // Navigate on selection
  useEffect(() => {
    if (!selectedItem) return;

    if (selectedItem.type === 'project') {
      navigate(`/projects/${selectedItem.id}/forms`);
      setSearchTerm('');
    } else if (selectedItem.type === 'organization') {
      navigate(`/organization/single-org/${selectedItem.id}/`);
      setSearchTerm('');
    }
  }, [selectedItem]);

  return (
    <div className="hidden md:flex items-center relative w-[80%] leading-7">
      <svg className="absolute left-4 w-4 h-4 fill-[#9e9ea7]" viewBox="0 0 24 24">
        <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
      </svg>

      <input
        type="search"
        placeholder="Search by organization or project name"
        className="w-full h-10 pl-10 pr-4 border-2 border-transparent rounded-full bg-[#f3f3f4] text-[#0d0c22] transition duration-300 ease-in-out placeholder:text-[#9e9ea7] focus:outline-none hover:border-[var(--primary2)] focus:border-[var(--primary2)] focus:bg-white focus:shadow-md"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {suggestions.length > 0 && (
        <div className="absolute top-12 w-full bg-white shadow-lg rounded-md border max-h-60 overflow-y-auto z-20">
          {suggestions.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(item)}
            >
              <span className="text-sm font-medium text-gray-800">{item.name}</span>
              <span className="text-xs text-gray-500 ml-2">({item.type})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
