const RegistroOrg = () => {
  return (
    <form>
        <label>Nombre de la organización: 
            <input type="text" name="nombreOrg" />
        </label>
        <label> Tipo de organización:
            <select onChange={this.handleChange}>
                <option value="fundacion">Fundación</option>
                <option value="asociacion_barrial">Asociación Barrial</option>
                <option value="ong">ONG</option>
                <option value="cooperativa">Cooperativa</option>
                <option value="empresa_social">Empresa Social</option>
            </select>
        </label>
    </form>
  );
};

export default RegistroOrg;