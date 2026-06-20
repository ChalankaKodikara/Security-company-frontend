
import React, { useState } from "react";


const Modal = () => {
  const [modal, setModal] = useState(false);

  const toggleModal = () => {
    setModal(!modal);
  };

  if(modal) {
    document.body.classList.add('active-modal')
  } else {
    document.body.classList.remove('active-modal')
  }

  return (
    <>
      <button onClick={toggleModal} className="btn-modal">
        Open
      </button>

      {modal && (
        <div className="modal">
          <div onClick={toggleModal} className="overlay"></div>
          <div className="modal-content">
            <h2>Hello Modal</h2>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Provident
              perferendis suscipit officia recusandae.
            </p>
            <button className="close-modal" onClick={toggleModal}>
              CLOSE
            </button>
          </div>
        </div>
      )}
      {/* <p>  unde? Quos blanditiis similique optio reiciendis ullam molestiae cum, quis ducimus nisi labore, consequuntur est soluta illum tempora, doloremque itaque non nesciunt saepe minus necessitatibus ex! Voluptatum, modi distinctio ullam unde neque quisquam excepturi impedit quae harum eum sit corporis assumenda dignissimos fuga sunt alias illum doloribus voluptatem, aliquid quia! Id sunt facilis odio soluta, accusamus vel voluptatum aut deserunt rerum laborum placeat adipisci doloribus! Deserunt, quisquam molestiae.</p> */}
    </>
  );
}

export default Modal


