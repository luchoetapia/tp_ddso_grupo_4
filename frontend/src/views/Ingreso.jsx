import Ingresar from "@/components/ingresar/ingresar";
import Registrar from "@/components/ingresar/registrar";

export default function Ingreso() {
    return (
        <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
            <div className="flex flex-col gap-6 flex-1">
                <Ingresar />
            </div>
            <div className="flex flex-col gap-6 flex-1">
                <Registrar />
            </div>
        </div>
       
    );
}
