const Sequelize = require("sequelize");
const {models} = require("../models");


// Autoload the tip with id equals to :tipId
exports.load = (req, res, next, tipId) => {

    models.tip.findById(tipId)
    .then(tip => {
        if (tip) {
            req.tip = tip;
            next();
        } else {
            next(new Error('There is no tip with tipId=' + tipId));
        }
    })
    .catch(error => next(error));
};

//Nuevo practica8: (similar al de quiz controller)
// MW that allows actions only if the user logged in is admin or is the author of the tip.
exports.adminOrAuthorRequired = (req, res, next) => {

    const isAdmin  = !!req.session.user.isAdmin;
    const isAuthor = req.tip.authorId === req.session.user.id;

    if (isAdmin || isAuthor) {
        next();
    } else {
        console.log('Prohibited operation: The logged in user is not the author of the tip, nor an administrator.');
        res.send(403);
    }
};

//Nuevo practica8: (similar al de quiz controller)
// GET /quizzes/:quizId/tips/:tipId/edit
exports.edit = (req, res, next) => {
    //recojo tip
    const {quiz, tip} = req;
    //mando a la vista edit.ejs con el formulario para editar el tip
    res.render('tips/edit', {quiz, tip});
};

//Nuevo practica8: (similar al de quiz controller)
// PUT /quizzes/:quizId/tips/:tipId
exports.update = (req, res, next) => {

    const {quiz, tip, body} = req;

    tip.text = body.text;

    //la pista debe volver al estado no moderado solo si la edita su autor
    const isAuthor = req.tip.authorId === req.session.user.id;
    if (isAuthor){tip.accepted = false;}   

    tip.save({fields: ["text", "accepted"]})
    .then(quiz => {
        req.flash('success', 'Tip edited successfully.');
        res.redirect('/quizzes/' + quiz.id+'/tips/'+tip.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('tips/edit', {quiz, tip});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Tip: ' + error.message);
        next(error);
    });
};



// POST /quizzes/:quizId/tips
exports.create = (req, res, next) => {
 
    const tip = models.tip.build(
        {
            text: req.body.text,
            quizId: req.quiz.id,
            //salvo tb al usuario logueado como creador del tip (como en quiz controller)
            authorId: req.session.user && req.session.user.id || 0
        });

    tip.save()
    .then(tip => {
        req.flash('success', 'Tip created successfully.');
        res.redirect("back");
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.redirect("back");
    })
    .catch(error => {
        req.flash('error', 'Error creating the new tip: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/tips/:tipId/accept
exports.accept = (req, res, next) => {

    const {tip} = req;

    tip.accepted = true;

    tip.save(["accepted"])
    .then(tip => {
        req.flash('success', 'Tip accepted successfully.');
        res.redirect('/quizzes/' + req.params.quizId);
    })
    .catch(error => {
        req.flash('error', 'Error accepting the tip: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId/tips/:tipId
exports.destroy = (req, res, next) => {

    req.tip.destroy()
    .then(() => {
        req.flash('success', 'tip deleted successfully.');
        res.redirect('/quizzes/' + req.params.quizId);
    })
    .catch(error => next(error));
};

