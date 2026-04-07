import countries from '../../public/data/country.json';

const CountryDropdown = ({ form, handleChange }) => {
    return (
        <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
                type="text"
                list="countries"
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Search or select country"
                className="border px-2 py-1 rounded-md w-full"
            />
            <datalist id="countries">
                {countries.map((country) => (
                    <option key={country} value={country} />
                ))}
            </datalist>
        </div>
    );
};

export default CountryDropdown;
